import "../src/index";
import type { HomeAssistant } from "../src/api";
import type { CircuitSetupPanel } from "../src/panel";

type Frame = Record<string, unknown> & { id?: number; type: string };

class HomeAssistantWebSocket implements HomeAssistant {
  private readonly socket = new WebSocket(`ws://${location.host}/api/websocket`);
  private readonly pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  private readonly subscriptions = new Map<number, (value: unknown) => void>();
  private nextId = 0;
  private readonly authenticated: Promise<void>;

  public readonly connection: HomeAssistant["connection"] = {
    subscribeMessage: async <T>(callback: (message: T) => void, message: Record<string, unknown>) => {
      await this.authenticated;
      const id = ++this.nextId;
      this.subscriptions.set(id, callback as (value: unknown) => void);
      await this.send(id, message);
      return () => {
        this.subscriptions.delete(id);
        void this.callWS({ type: "unsubscribe_events", subscription: id });
      };
    },
  };

  public constructor() {
    this.authenticated = new Promise((resolve, reject) => {
      this.socket.addEventListener("message", (event) => {
        const frame = JSON.parse(String(event.data)) as Frame;
        if (frame.type === "auth_required") {
          this.socket.send(JSON.stringify({ type: "auth", access_token: "playwright-token" }));
          return;
        }
        if (frame.type === "auth_ok") {
          resolve();
          return;
        }
        if (frame.type === "auth_invalid") {
          reject(new Error("Home Assistant websocket authentication failed"));
          return;
        }
        if (frame.type === "event" && frame.id !== undefined) {
          this.subscriptions.get(frame.id)?.(frame.event);
          return;
        }
        if (frame.type !== "result" || frame.id === undefined) return;
        const request = this.pending.get(frame.id);
        if (!request) return;
        this.pending.delete(frame.id);
        if (frame.success === true) request.resolve(frame.result);
        else {
          const detail = frame.error as { code?: string; message?: string } | undefined;
          request.reject(Object.assign(new Error(detail?.message ?? "WebSocket command failed"), { code: detail?.code }));
        }
      });
      this.socket.addEventListener("error", () => reject(new Error("Home Assistant websocket failed")));
    });
  }

  public async callWS<T>(message: Record<string, unknown>): Promise<T> {
    await this.authenticated;
    return this.send(++this.nextId, message) as Promise<T>;
  }

  private send(id: number, message: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, ...message }));
    });
  }
}

const panel = document.querySelector("circuitsetup-energy-meter-helper-panel") as CircuitSetupPanel;
panel.panel = { config: { entry_id: "qa-entry" } };
panel.hass = new HomeAssistantWebSocket();
