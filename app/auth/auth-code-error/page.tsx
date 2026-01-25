export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
        <p className="text-muted-foreground">
          There was an error during authentication. Please try again.
        </p>
      </div>
    </div>
  );
}
