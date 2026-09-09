import type { ComponentType } from 'react'
import { Pressable, type StyleProp, Text, type TextStyle, View } from 'react-native'
import { Ionicons, type IoniconsIconName } from '@react-native-vector-icons/ionicons'
import { styled } from 'nativewind'
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs'

const IoniconsBase = Ionicons as ComponentType<{
    name: IoniconsIconName
    size?: number
    style?: StyleProp<TextStyle>
}>

const Icon = styled(IoniconsBase, { className: 'style' })

const ICONS_NOTFOCUSED: Record<string, IoniconsIconName> = {
    index: 'reader-outline',
    history: 'time-outline',
    account: 'person-outline',
}

const ICONS_FOCUSED: Record<string, IoniconsIconName> = {
    index: 'reader',
    history: 'time',
    account: 'person',
}

const ICON_SIZE = 24

export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
    return (
        <View
            className="flex-row border-t border-bd-hair bg-bar px-1 pt-2.5"
            style={{ paddingBottom: insets.bottom + 10 }}
        >
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key]
                const focused = state.index === index
                const label =
                    typeof options.tabBarLabel === 'string'
                        ? options.tabBarLabel
                        : (options.title ?? route.name)

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    })

                    if (!focused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params)
                    }
                }

                return (
                    <Pressable
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={{ selected: focused }}
                        accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                        onPress={onPress}
                        className="flex-1 items-center gap-1 py-1"
                    >
                        <Icon
                            name={focused ? ICONS_FOCUSED[route.name] ?? 'ellipse' : ICONS_NOTFOCUSED[route.name] ?? 'ellipse-outline'}
                            size={ICON_SIZE}
                            className={focused ? 'text-accent-text' : 'text-t4'}
                        />
                        <Text
                            className={`font-ui-700 text-[11px] ${focused ? 'text-accent-text' : 'text-t4'}`}
                        >
                            {label}
                        </Text>
                    </Pressable>
                )
            })}
        </View>
    )
}
