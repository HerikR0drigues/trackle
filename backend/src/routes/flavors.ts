import { Router } from 'express'
import { flavorResource } from '../resources/flavorResource'

const router = Router()

router.get('/', flavorResource.list)

export default router
