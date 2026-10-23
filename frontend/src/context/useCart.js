import { useContext } from 'react';
import { CartContext } from './CartContextDef';

export const useCart = () => useContext(CartContext);
