// O estado visivel so muda depois de confirmacao do servidor.
export async function confirmedWrite<T>(request: () => Promise<T>, apply: (result: T) => void): Promise<T> {
  const result = await request();
  apply(result);
  return result;
}
