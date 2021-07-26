import { EventService } from '../model/EventService';

import EE2EventService from './EE2EventService';

import pino from 'pino';

type AppEvents = {
  'foo.bar': (foobar: { foo: string, bar: boolean }) => void,
  error: (error: unknown) => void,
}

type AppEventService = EventService<AppEvents>;

describe('EventEmitter2 Event Service', () => {

  const getEventService = () => new EE2EventService(pino({ enabled: false }));

  it('should be usable as an App Event Service', (done) => {
    const es = getEventService() as AppEventService;
    es.once('error', (error: unknown) => {
      expect(error).toBeTruthy();
      expect((error as Error).message).toEqual('Kaboom');
      done();
    });
    es.emit('error', new Error('Kaboom'));
  });

  it('should be usable as an Domain Event Service', (done) => {
    const es = getEventService() as AppEventService;
    es.once('foo.bar', (event) => {
      expect(event).toBeTruthy();
      expect(event.foo).toEqual('baz');
      done();
    });
    es.emit('foo.bar', {
      foo: 'baz',
      bar: false,
    });
  });

  it('should swallow errors in listeners and not let them propagate', () => {
    const es = getEventService() as AppEventService;
    es.once('foo.bar', () => {
      throw new Error('Kaboom');
    });
    es.emit('foo.bar', {
      foo: 'baz',
      bar: false,
    });
  });
});
