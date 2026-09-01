'use client';

import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

const GENERIC_ERROR_MESSAGE = 'Please check if a browser extension (like an ad blocker) is interfering, or if you have the necessary permissions.';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch((error) => {
    // A denied/failed write is a normal business condition: surface it as a
    // toast and log it. It must NEVER take down the whole app — the global
    // onThrow would otherwise blank the entire page on a refused save.
    console.error('Firestore write blocked:', docRef.path, error);
    toast({
      variant: 'destructive',
      title: 'Save Operation Blocked',
      description: GENERIC_ERROR_MESSAGE,
    });
  });
  // Execution continues immediately
}

/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data).catch((error) => {
    console.error('Firestore create blocked:', colRef.path, error);
    toast({
      variant: 'destructive',
      title: 'Save Operation Blocked',
      description: GENERIC_ERROR_MESSAGE,
    });
  });
  return promise;
}

/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data).catch((error) => {
    console.error('Firestore update blocked:', docRef.path, error);
    toast({
      variant: 'destructive',
      title: 'Update Operation Blocked',
      description: GENERIC_ERROR_MESSAGE,
    });
  });
}

/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef).catch((error) => {
    console.error('Firestore delete blocked:', docRef.path, error);
    toast({
      variant: 'destructive',
      title: 'Delete Operation Blocked',
      description: GENERIC_ERROR_MESSAGE,
    });
  });
}
