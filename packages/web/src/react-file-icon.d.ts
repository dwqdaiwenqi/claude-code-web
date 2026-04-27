declare module 'react-file-icon' {
  import type { CSSProperties, FC } from 'react'

  interface FileIconProps {
    extension?: string
    type?: string
    color?: string
    secondaryColor?: string
    fold?: boolean
    glyphColor?: string
    labelColor?: string
    labelTextColor?: string
    radius?: number
    size?: number
    [key: string]: unknown
  }

  export const FileIcon: FC<FileIconProps>
  export const defaultStyles: Record<string, FileIconProps>
}
