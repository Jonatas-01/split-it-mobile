export type MinorUnits = number;

export interface Person {
    id: string;
    name: string;
    color: string;
    isHost: boolean;
}

export interface BillItem {
    id: string;
    name: string;
    price: MinorUnits;
    assignedTo: string[];
}

export interface Bill {
    id: string;
    restaurantName: string;
    items: BillItem[];
    people: Person[];
    serviceChargePercent: number;
    currency: string;
    splitMode: "itemised" | "equal";
    createdAt: string;
}
