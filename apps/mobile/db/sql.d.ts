// Type declaration for .sql files imported via babel-plugin-inline-import
declare module '*.sql' {
  const content: string;
  export default content;
}
