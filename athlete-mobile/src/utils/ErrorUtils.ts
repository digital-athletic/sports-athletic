export function getErrorCode(error: unknown): string | undefined {
  if (error instanceof Error && "code" in error) {
    return (error as Error & { code: string }).code;
  }
  return undefined;
}
