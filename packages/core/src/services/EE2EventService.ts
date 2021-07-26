import { EventEmitter2 } from 'eventemitter2';
import { Logger } from 'pino';
import { EventService } from '../model/EventService';
import { AnyFunc } from '@service-t/api/dist/AnyFunc';
import { FrameworkEvents } from '../events/FrameworkEvents';

import formatError from '@service-t/api/dist/errors/formatError';

/**
 * Typing this beast to be generic is beyond my knowledge in TypeScript (and is exceeding my patience).
 * Feel free to alias this class in your dependencies chain to whatever type you want.
 *
 * e.g.  myEventService: EventService<MyEvents>
 */
export default class EE2EventService implements EventService<FrameworkEvents> {

  private ee: EventEmitter2;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.child({ component: 'EE2EventService' });
    this.ee = new EventEmitter2({
      maxListeners: 25,
      ignoreErrors: true,
    });
  }

  emit(event: string, args: unknown): boolean {
    this.ee.emit(event, args);
    return false;
  }

  protected swallowError(listener: AnyFunc): AnyFunc {
    return (...args) => {
      try {
        listener(...args);
      } catch (error) {
        this.logger.error(formatError(error), 'An error occurred invoking event handler.');
      }
    };
  }

  off(event: string, listener: AnyFunc): this {
    this.ee.off(event, listener);
    return this;
  }

  on(event: string, listener: AnyFunc): this {
    this.ee.on(event, this.swallowError(listener));
    return this;
  }

  once(event: string, listener: AnyFunc): this {
    this.ee.once(event, this.swallowError(listener));
    return this;
  }

  removeListener(event: string, listener: AnyFunc): this {
    this.ee.removeListener(event, listener);
    return this;
  }
}
