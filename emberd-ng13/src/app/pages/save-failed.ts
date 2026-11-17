export function saveFailedMessage(error: any): string {
  const message = error && (error.message || (error.error && error.error.message));
  return 'Save failed' + (message ? ': ' + message : '');
}
