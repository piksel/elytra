import { FieldDesc, ValueTypes } from "./types";

export const fieldInputType = (field: FieldDesc) => {
  switch (field.valueType) {
    case ValueTypes.Bytes: return 'text';
    case ValueTypes.Integer: return 'number';
    case ValueTypes.Secret: return 'password';
    case ValueTypes.Text: return 'text';
  }
}