export const idlFactory = ({ IDL }) => {
  const Result_1 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
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
        [Result_1],
        [],
      ),
    'clearCanvas' : IDL.Func([], [Result], []),
    'deleteShape' : IDL.Func([IDL.Nat], [Result], []),
    'getCanvas' : IDL.Func([], [IDL.Vec(Shape)], ['query']),
    'updateCanvas' : IDL.Func([IDL.Vec(Shape)], [Result], []),
    'updateShape' : IDL.Func(
        [
          IDL.Nat,
          IDL.Float64,
          IDL.Float64,
          IDL.Float64,
          IDL.Opt(IDL.Float64),
          IDL.Opt(IDL.Float64),
        ],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
