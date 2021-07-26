// Borrowed from https://github.com/binier/tiny-typed-emitter/blob/master/lib/index.d.ts
export type ListenerSignature<L> = {
  [E in keyof L]: (...args: any[]) => any;
};

export type DefaultListener = {
  [k: string]: (...args: any[]) => any;
};

export interface EventService<L extends ListenerSignature<L> = DefaultListener> {
  removeListener<U extends keyof L>(event: U, listener: L[U]): this;
  once<U extends keyof L>(event: U, listener: L[U]): this;
  on<U extends keyof L>(event: U, listener: L[U]): this;
  off<U extends keyof L>(event: U, listener: L[U]): this;
  emit<U extends keyof L>(event: U, ...args: Parameters<L[U]>): boolean;
}
