declare module 'xmlbuilder' {
  export interface XMLElement {
    ele(name: string, value?: string): XMLElement
    att(name: string, value: string): XMLElement
    text(value: string): XMLElement
    end(options?: { pretty?: boolean; indent?: string; newline?: string }): string
  }

  interface CreateOptions {
    version?: string
    encoding?: string
  }

  interface XmlBuilder {
    create(name: string, options?: CreateOptions): XMLElement
  }

  const xmlbuilder: XmlBuilder
  export default xmlbuilder
}
