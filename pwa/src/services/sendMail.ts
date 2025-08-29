import { apiUrl } from '@/services/index';

// Send quote request (should also create a lead/enquiry)
export const sendQuoteRequest = async (payload: {
  name: string;
  phone: string;
  email: string;
  company: string;
  items: { [key: string]: unknown }[];
}) => {
  // Send to /enquiry with quote as payload
  const response = await fetch(`${apiUrl}/enquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      company: payload.company,
      message: 'Quote Request',
      quote: { items: payload.items },
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to send quote request');
  }
  return response.json();
};

// Send general enquiry (lead)
export const createEnquiryLead = async (payload: {
  name: string;
  phone: string;
  email: string;
  company: string;
  message: string;
  quote?: { items: { [key: string]: unknown }[] };
}) => {
  const response = await fetch(`${apiUrl}/enquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to create enquiry');
  }
  return response.json();
};