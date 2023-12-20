import { configureStore } from '@reduxjs/toolkit';
import appReduce from './appSlice'

export const store = configureStore({
  reducer: {
    app: appReduce,
  },
})