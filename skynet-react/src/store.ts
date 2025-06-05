import { configureStore } from '@reduxjs/toolkit';
import dataManagement from './other/DataManagement';

export const store = configureStore(
{
  reducer: 
  {
    data: dataManagement,
  },
});