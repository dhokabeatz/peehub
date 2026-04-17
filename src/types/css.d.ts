// Tells TypeScript that CSS files are valid side-effect imports.
// Next.js handles the actual CSS processing at build time.
declare module '*.css' {
  const content: Record<string, string>
  export default content
}
