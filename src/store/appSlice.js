import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  bids: {},
  asks: {},
  psnap: {},
  mcnt: 0
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    add: (state, action) => {
      state.bids = action.payload.bids
      state.asks = action.payload.asks
      state.psnap = action.payload.psnap
      state.mcnt = action.payload.mcnt
    },
  },
})

// Action creators are generated for each case reducer function
export const { add } = appSlice.actions

export default appSlice.reducer