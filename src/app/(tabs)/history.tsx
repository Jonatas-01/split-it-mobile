import { View, Text } from 'react-native'
import { SafeAreaView } from "react-native-safe-area-context"

export default function history() {
    return (
        <View className="flex-1 bg-bg-app p-safe">
            <Text className="text-t1 text-title font-ui-800">History</Text>
        </View>
    )
}