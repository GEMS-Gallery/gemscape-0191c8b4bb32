import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Shape {
  'x' : number,
  'y' : number,
  'id' : bigint,
  'color' : string,
  'shapeType' : string,
}
export interface _SERVICE {
  'addShape' : ActorMethod<[string, number, number, string], bigint>,
  'deleteShape' : ActorMethod<[bigint], boolean>,
  'getCanvas' : ActorMethod<[], Array<Shape>>,
  'moveShape' : ActorMethod<[bigint, number, number], boolean>,
  'updateCanvas' : ActorMethod<[Array<Shape>], boolean>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
