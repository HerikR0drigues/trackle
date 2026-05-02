import { Router } from 'express'
import { puzzleResource } from '../resources/puzzleResource'

const router = Router()

router.get('/daily', puzzleResource.getDaily)

export default router
