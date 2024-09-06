import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Shape {
  'x' : number,
  'y' : number,
  'id' : bigint,
  'endX' : [] | [number],
  'endY' : [] | [number],
  'color' : string,
  'size' : number,
  'shapeType' : string,
}
export interface _SERVICE {
  'addShape' : ActorMethod<
    [string, number, number, string, number, [] | [number], [] | [number]],
    bigint
  >,
  'deleteShape' : ActorMethod<[bigint], boolean>,
  'getCanvas' : ActorMethod<[], Array<Shape>>,
  'updateCanvas' : ActorMethod<[Array<Shape>], boolean>,
  'updateShape' : ActorMethod<
    [bigint, number, number, number, [] | [number], [] | [number]],
    boolean
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
