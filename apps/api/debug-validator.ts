import 'reflect-metadata';
import { validate, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { IsString, IsOptional, IsInt, MinLength } from 'class-validator';

function ExactlyOneOfCourseOrSection(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'exactlyOneOfCourseOrSection',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const hasCourseId = obj.courseId !== undefined && obj.courseId !== null && obj.courseId !== '';
          const hasSectionId = obj.sectionId !== undefined && obj.sectionId !== null && obj.sectionId !== '';
          console.log('validate called:', { hasCourseId, hasSectionId, property: args.property });
          return hasCourseId !== hasSectionId;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Exactly one of courseId or sectionId must be provided';
        }
      }
    });
  };
}

@ExactlyOneOfCourseOrSection()
class TestDto {
  @IsOptional() @IsString() courseId?: string;
  @IsOptional() @IsString() sectionId?: string;
  @IsString() @MinLength(1) title!: string;
  @IsString() content!: string;
  @IsInt() position!: number;
}

async function test() {
  console.log('--- test 1: no parent ---');
  const dto = new TestDto();
  dto.title = 'Test';
  dto.content = 'content';
  dto.position = 1;
  const errors = await validate(dto);
  console.log('errors:', errors.length, errors.map(e => e.property));

  console.log('--- test 2: courseId only ---');
  const dto2 = new TestDto();
  dto2.courseId = 'course-1';
  dto2.title = 'Test';
  dto2.content = 'content';
  dto2.position = 1;
  const errors2 = await validate(dto2);
  console.log('errors:', errors2.length, errors2.map(e => e.property));

  console.log('--- test 3: sectionId only ---');
  const dto3 = new TestDto();
  dto3.sectionId = 'section-1';
  dto3.title = 'Test';
  dto3.content = 'content';
  dto3.position = 1;
  const errors3 = await validate(dto3);
  console.log('errors:', errors3.length, errors3.map(e => e.property));

  console.log('--- test 4: both ---');
  const dto4 = new TestDto();
  dto4.courseId = 'course-1';
  dto4.sectionId = 'section-1';
  dto4.title = 'Test';
  dto4.content = 'content';
  dto4.position = 1;
  const errors4 = await validate(dto4);
  console.log('errors:', errors4.length, errors4.map(e => e.property));
}

test();