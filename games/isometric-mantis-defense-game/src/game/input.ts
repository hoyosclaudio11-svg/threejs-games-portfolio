/**
 * Gestor de entrada: teclado + ratón. Lleva el set de teclas pulsadas,
 * las teclas "recién pulsadas" (consumidas al final del frame) y la
 * posición del puntero en coordenadas de cliente para convertir a NDC.
 */
export class Input {
  readonly keys = new Set<string>();
  private readonly pressed = new Set<string>();
  pointer = { x: 0, y: 0, inside: false };
  mouseDown = false;
  private mPressed = false;
  private rPressed = false;
  private el: HTMLElement;

  private onKeyDown: (e: KeyboardEvent) => void;
  private onKeyUp: (e: KeyboardEvent) => void;
  private onMouseMove: (e: MouseEvent) => void;
  private onMouseDown: (e: MouseEvent) => void;
  private onMouseUp: (e: MouseEvent) => void;
  private onContext: (e: Event) => void;
  private onBlur: () => void;

  constructor(el: HTMLElement) {
    this.el = el;
    this.onKeyDown = (e) => {
      // Evita scroll con espacio / flechas dentro del canvas.
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code
        )
      ) {
        e.preventDefault();
      }
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
    };
    this.onKeyUp = (e) => this.keys.delete(e.code);
    this.onMouseMove = (e) => {
      this.pointer.x = e.clientX;
      this.pointer.y = e.clientY;
      this.pointer.inside = true;
    };
    this.onMouseDown = (e) => {
      if (e.button === 0) {
        this.mouseDown = true;
        this.mPressed = true;
      } else if (e.button === 2) {
        this.rPressed = true;
      }
    };
    this.onMouseUp = (e) => {
      if (e.button === 0) this.mouseDown = false;
    };
    this.onContext = (e) => e.preventDefault();
    this.onBlur = () => {
      this.keys.clear();
      this.mouseDown = false;
    };

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("mousemove", this.onMouseMove);
    this.el.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    this.el.addEventListener("contextmenu", this.onContext);
    window.addEventListener("blur", this.onBlur);
  }

  isDown(...codes: string[]): boolean {
    return codes.some((c) => this.keys.has(c));
  }

  /** ¿Se pulsó alguna de estas teclas en este frame? */
  justPressed(...codes: string[]): boolean {
    return codes.some((c) => this.pressed.has(c));
  }

  mousePressed(): boolean {
    return this.mPressed;
  }

  rightPressed(): boolean {
    return this.rPressed;
  }

  /** Llamar al final de cada frame para limpiar las señales "just pressed". */
  endFrame(): void {
    this.pressed.clear();
    this.mPressed = false;
    this.rPressed = false;
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("mousemove", this.onMouseMove);
    this.el.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    this.el.removeEventListener("contextmenu", this.onContext);
    window.removeEventListener("blur", this.onBlur);
  }
}
