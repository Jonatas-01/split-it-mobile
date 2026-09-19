import type { ComponentType } from 'react'
import type { StyleProp, TextStyle } from 'react-native'
import { Ionicons, type IoniconsIconName } from '@react-native-vector-icons/ionicons'
import { styled } from 'nativewind'

const IoniconsBase = Ionicons as ComponentType<{
    name: IoniconsIconName
    size?: number
    style?: StyleProp<TextStyle>
}>

/* Icons take their colour from a `text-*` token via className — never a
   `color` prop, which would mean a raw hex. */
export const Icon = styled(IoniconsBase, { className: 'style' })

export type { IoniconsIconName }
