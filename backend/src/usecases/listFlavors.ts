import type { FlavorRepository, FlavorSummary } from '../repositories/flavorRepository'

export interface ListFlavorsDeps {
  flavorRepo: FlavorRepository
}

export const makeListFlavors =
  ({ flavorRepo }: ListFlavorsDeps) =>
  (): Promise<FlavorSummary[]> => {
    return flavorRepo.findAllSummaries()
  }
