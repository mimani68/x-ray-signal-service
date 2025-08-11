export enum CONDITION_EXTERNAL_OPERATOR {
  AND = 'AND',
  OR = 'OR',
}

export enum CONDITION_INTERNAL_OPERATOR {
  GT = '>',
  GTE = '>=',
  LT = '<',
  LTE = '<=',
  EQ = '=',
}

export enum SORT_ORDER {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum CONDITION_FIELD_TYPE {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
}

export const paginationMinTakeCount = 1;
export const paginationMaxTakeCount = 50;
export const paginationMidTakeCount = 20;
