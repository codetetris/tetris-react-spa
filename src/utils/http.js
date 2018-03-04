import axios from 'axios'
import { isEmpty } from 'lodash'

import LocalStorageManager from './LocalStorageManager'
import UserMiddleware from 'modules/user/middleware'
import configureStore from 'store/configureStore'

const store = configureStore

const isUsingProductionAPI = process.env.REACT_APP_SERVER_ENV === 'production'

const backendHost = isUsingProductionAPI
  ? 'https://datagateway.fractaltecnologia.com.br'
  : 'https://staging.datagateway.fractaltecnologia.com.br'

const apiVersion = 'v1'

const instance = axios.create({
  baseURL: `${backendHost}/api/${apiVersion}`
})

const user = LocalStorageManager.getUser()

// update instance with token
export const setToken = (token) => (
  instance.defaults.headers.common['X-TOKEN'] = token
)

if (!isEmpty(user)) setToken(user.token)

instance.interceptors.response.use(
  response => response,
  /**
  * This is a central point to handle all
  * error messages generated by HTTP
  * requests
  */
  (error) => {
    const { response } = error
    /**
    * If token is either expired, not provided or invalid
    * then redirect to login. On server side the error
    * messages can be changed on app/Providers/EventServiceProvider.php
    */
    if ([401, 400].indexOf(response.status) > -1) {
      // this logic is to verify if url has auth
      const hasAuth = error.config.url.includes('auth')
      if (!hasAuth) {
        LocalStorageManager.clearLocalStorage()
        store.dispatch(UserMiddleware.clearUser())
      }
    }
    return Promise.reject(error)
  }
)

export default instance