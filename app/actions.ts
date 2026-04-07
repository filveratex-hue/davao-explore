'use server'

import { revalidatePath } from 'next/cache';

/**
 * Revalidates the data on the home page.
 * Call this after making changes to places, images, or reviews
 * to ensure the main visit feed is up to date immediately.
 */
export async function revalidateData() {
  revalidatePath('/');
}
