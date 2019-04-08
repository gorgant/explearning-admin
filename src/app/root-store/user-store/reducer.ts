import { initialState, State } from './state';
import { Actions, ActionTypes } from './actions';

export function featureReducer(state = initialState, action: Actions): State {
  switch (action.type) {
    case ActionTypes.USER_DATA_REQUESTED:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case ActionTypes.USER_DATA_LOADED:
      return {
        ...state,
        user: action.payload.userData,
        isLoading: false,
        error: null,
        userLoaded: true,
      };
    case ActionTypes.STORE_USER_DATA_REQUESTED:
      return {
        ...state,
        isLoading: true,
      };
    case ActionTypes.UPDATE_PASSWORD_COMPLETE:
      return {
        ...state,
        error: null,
      };
    case ActionTypes.USER_DATA_LOAD_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload.error
      };

    default: {
      return state;
    }
  }
}