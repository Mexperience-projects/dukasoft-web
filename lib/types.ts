export interface ServicesType {
  id: number;
  name: string;
  price: number;
  description: string;
  personel: number[];
  items: number;
  personel_fixed_fee: number;
  personel_precent_fee: number;
}

export interface PersonelType {
  id: number;
  name: string;
  description: string;
  visits: VisitType[];
  doctorExpense: number;
}

export interface VisitType {
  id: number;
  client: ClientType;
  service: number[];
  items: number;
  datetime: Date;
  payments: PaymentsType[];
}

export interface ClientType {
  id: number;
  name: string;
  nationalCo: string;
  birthdate: Date;
  gender: number;
}

export interface ItemsType {
  id: number;
  item: number;
  name: string;
  price: number;
  count: number;
}

export interface Service_itemsType {
  id: number;
  item: number[];
  service: number[];
  count: number;
}

export interface Visit_itemType {
  id: number;
  count: number;
  item: number[];
  visit: number[];
}

export interface Visit_paymentType {
  id: number;
  visit: number[];
  price: number;
  paid: boolean;
}

export interface PaymentsType {
  id: number;
  personel_id: PersonelType["id"];
  price: number;
  date: Date;
  created_at: Date;
  paid: boolean;
  visit: VisitType;
}
