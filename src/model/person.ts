export abstract class Person {
  constructor(protected id: number = 0) {}

  getId = () => this.id;
}
