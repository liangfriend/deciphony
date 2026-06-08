import xmlbuilder, { type XMLElement } from 'xmlbuilder'

export type XmlElement = XMLElement

/** 创建带 XML 声明的根文档 */
export function createXmlDocument(
  rootName: string,
  options?: { version?: string; encoding?: string }
): XmlElement {
  return xmlbuilder.create(rootName, {
    version: options?.version ?? '1.0',
    encoding: options?.encoding ?? 'UTF-8'
  })
}

export function elem(parent: XmlElement, name: string): XmlElement {
  return parent.ele(name)
}

export function text(parent: XmlElement, name: string, value: string | number): XmlElement {
  return parent.ele(name, String(value))
}

export function attr(element: XmlElement, name: string, value: string | number): XmlElement {
  return element.att(name, String(value))
}

export function serializeXml(root: XmlElement, pretty = true): string {
  return root.end({ pretty, indent: '  ', newline: '\n' })
}
