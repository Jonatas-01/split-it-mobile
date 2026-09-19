import { Text, View } from "react-native";
import type { Bill, MinorUnits, Person } from "@/types/bill";

/** Avatars shown before the overflow chip takes over. */
const AVATARS_SHOWN = 2;

/* Person colours are semantic tokens, so the class names are spelled out
   a template literal would be invisible to the Tailwind scanner. */
const FILL: Record<string, string> = {
    "person-1": "bg-person-1",
    "person-2": "bg-person-2",
    "person-3": "bg-person-3",
    "person-4": "bg-person-4",
    "person-5": "bg-person-5",
    "person-6": "bg-person-6",
};

const INK: Record<string, string> = {
    "person-1": "text-person-1-ink",
    "person-2": "text-person-2-ink",
    "person-3": "text-person-3-ink",
    "person-4": "text-person-4-ink",
    "person-5": "text-person-5-ink",
    "person-6": "text-person-6-ink",
};

function grandTotal(bill: Bill): MinorUnits {
    const subtotal = bill.items.reduce((sum, item) => sum + item.price, 0);
    const rate = Math.round(bill.serviceChargePercent * 100);
    const service = Math.floor((subtotal * rate + 5000) / 10000);
    return subtotal + service;
}

function formatMoney(amount: MinorUnits, currency: string) {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount / 100);
}

function shortDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
    });
}

function initialOf(name: string) {
    return name.trim().charAt(0).toUpperCase();
}

function Avatar({ person, stacked }: { person: Person; stacked: boolean }) {
    return (
        <View
            className={`w-9 h-9 rounded-pill items-center justify-center border-2 border-bg-card ${FILL[person.color]
                } ${stacked ? "-ml-3" : ""}`}
        >
            <Text className={`text-body font-ui-800 ${INK[person.color]}`}>
                {initialOf(person.name)}
            </Text>
        </View>
    );
}

export default function HistoryCard({ bill }: { bill: Bill }) {
    const shown = bill.people.slice(0, AVATARS_SHOWN);
    const overflow = bill.people.length - shown.length;

    return (
        <View className="flex-row items-center gap-3 mb-3 px-4 py-3 bg-bg-card border border-bd-card rounded-card">
            <View className="w-[84px] flex-row items-center">
                {shown.map((person, i) => (
                    <Avatar key={person.id} person={person} stacked={i > 0} />
                ))}
                {overflow > 0 ? (
                    <View className="w-9 h-9 -ml-3 rounded-pill items-center justify-center bg-bg-control border-2 border-bg-card">
                        <Text
                            numberOfLines={1}
                            className="text-body font-ui-700 text-t3"
                        >
                            +{overflow}
                        </Text>
                    </View>
                ) : null}
            </View>

            <View className="flex-1 gap-0.5">
                <Text
                    numberOfLines={1}
                    className="text-row font-ui-700 text-t1"
                >
                    {bill.restaurantName}
                </Text>
                <Text className="text-body font-ui-500 text-t4">
                    {shortDate(bill.createdAt)} · {bill.people.length}{" "}
                    {bill.people.length === 1 ? "person" : "people"}
                </Text>
            </View>

            <Text className="text-amount font-money-700 text-t1 tabular-nums">
                {formatMoney(grandTotal(bill), bill.currency)}
            </Text>
        </View>
    );
}
