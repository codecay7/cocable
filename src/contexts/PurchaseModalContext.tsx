import React, { createContext, useState, useContext, ReactNode } from 'react';

interface PurchaseModalContextType {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const PurchaseModalContext = createContext<PurchaseModalContextType | undefined>(undefined);

export const PurchaseModalProvider = ({ children }: { children: ReactNode }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <PurchaseModalContext.Provider value={{ isModalOpen, openModal, closeModal }}>
      {children}
    </PurchaseModalContext.Provider>
  );
};

export const usePurchaseModal = () => {
  const context = useContext(PurchaseModalContext);
  if (context === undefined) {
    throw new Error('usePurchaseModal must be used within a PurchaseModalProvider');
  }
  return context;
};