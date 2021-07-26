/**
 * I've agonized over whether this should be an interface or abstract class.
 * I think the case could be made either way.  The reason why I've settled with
 * abstract class is that it's easier to implement (don't need to extend Error and
 * implement CodedError).  Also, if we want to append functionality onto errors in
 * the future, we may be able to do it transparently (however, I admit this is
 * generally not a great reason).
 */
export abstract class CodedError extends Error {
  public abstract code: string;
}
