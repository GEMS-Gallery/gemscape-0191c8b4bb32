export const idlFactory = ({ IDL }) => {
  const Shape = IDL.Record({
    'x' : IDL.Float64,
    'y' : IDL.Float64,
    'id' : IDL.Nat,
    'endX' : IDL.Opt(IDL.Float64),
    'endY' : IDL.Opt(IDL.Float64),
    'color' : IDL.Text,
    'size' : IDL.Float64,
    'shapeType' : IDL.Text,
  });
  return IDL.Service({
    'addShape' : IDL.Func(
        [
          IDL.Text,
          IDL.Float64,
          IDL.Float64,
          IDL.Text,
          IDL.Float64,
          IDL.Opt(IDL.Float64),
          IDL.Opt(IDL.Float64),
        ],
        [IDL.Nat],
        [],
      ),
    'deleteShape' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'getCanvas' : IDL.Func([], [IDL.Vec(Shape)], ['query']),
    'updateCanvas' : IDL.Func([IDL.Vec(Shape)], [IDL.Bool], []),
    'updateShape' : IDL.Func(
        [
          IDL.Nat,
          IDL.Float64,
          IDL.Float64,
          IDL.Float64,
          IDL.Opt(IDL.Float64),
          IDL.Opt(IDL.Float64),
        ],
        [IDL.Bool],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
