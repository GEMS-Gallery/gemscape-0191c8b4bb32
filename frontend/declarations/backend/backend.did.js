export const idlFactory = ({ IDL }) => {
  const Shape = IDL.Record({
    'x' : IDL.Float64,
    'y' : IDL.Float64,
    'id' : IDL.Nat,
    'color' : IDL.Text,
    'shapeType' : IDL.Text,
  });
  return IDL.Service({
    'addShape' : IDL.Func(
        [IDL.Text, IDL.Float64, IDL.Float64, IDL.Text],
        [IDL.Nat],
        [],
      ),
    'deleteShape' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'getCanvas' : IDL.Func([], [IDL.Vec(Shape)], ['query']),
    'moveShape' : IDL.Func([IDL.Nat, IDL.Float64, IDL.Float64], [IDL.Bool], []),
    'updateCanvas' : IDL.Func([IDL.Vec(Shape)], [IDL.Bool], []),
  });
};
export const init = ({ IDL }) => { return []; };
