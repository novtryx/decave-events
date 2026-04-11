"use server"
import { protectedFetch } from "@/lib/protectedFetch";
import { publicFetch } from "@/lib/publicFetch";
import { redirect } from "next/navigation";

// types/event.ts

export type CreateTicketPayload = {
  type: string;
  description: string;
  price: number;
  startQty: number;
  startDate: string;
  stopdate: string;
};

export type CreateEventPayload = {
  title: string;
  type: string;
  description: string;
  venue: string;
  address: string;
  eventDate: string;
  visibilty?: boolean;
  theme?: string;
  organizerPays?: boolean;
  banner: string;
  tickets: CreateTicketPayload[];
};

export type InitializePayment = {
  email: string;
  name: string;
  phone: string;
  eventId: number;
  ticketId: string;
};

export async function createEvent(payload: CreateEventPayload): Promise<void> {
  const res = await protectedFetch<any>("/events", {
    method: "POST",
    body: payload,
  });

     redirect("/dashboard/events") // server response

}

export async function getUserEvents(): Promise<any> {
  const res = await protectedFetch<any>("/events/events-by-user", {
    method: "GET"
  });

return res

}

export async function getEventByName(name: string): Promise<any> {
  const res = await publicFetch<any>(`/events/${name}`, {
    method: "GET"
  });

return res

}


export async function initializePayment(payload: InitializePayment[]): Promise<any> {
  const res = await publicFetch<any>(`/paystack/initialize`, {
    method: "POST",
    body: payload
  });

return res

}


export async function getAttendeesByRef(ref: string): Promise<any> {
  const res = await publicFetch<any>(`/attendees/ref?ref=${ref}`, {
    method: "GET",
  });

return res

}

export async function getAttendeesById(eventId: string, page: string, limit:string): Promise<any> {
  const res = await protectedFetch<any>(`/attendees/event/${eventId}?page=${page}&limit=${limit}`, {
    method: "GET",
  });

return res

}

export async function getDashboardOverview(): Promise<any> {
  const res = await protectedFetch<any>("/events/dashboard-overview", {
    method: "GET",
  });
  return res;
}