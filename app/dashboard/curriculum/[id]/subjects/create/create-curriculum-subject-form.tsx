"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { SEMESTER_TERMS, type SemesterTermValue } from '@/lib/semester-terms';
import { createCurriculumSubject } from '@/actions/curriculum';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';

type SubjectOption = {
  id: string;
  code: string;
  description: string;
};

interface CreateCurriculumSubjectFormProps {
  curriculumId: string;
  prerequisiteOptions: SubjectOption[];
}

const CreateCurriculumSubjectForm = ({ curriculumId, prerequisiteOptions }: CreateCurriculumSubjectFormProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [isPending, startTransition] = useTransition();

  const [values, setValues] = useState({
    code: '',
    description: '',
    units: '3',
    yearLevel: '1',
    semester: 'FIRST' as SemesterTermValue,
    displayOrder: '0',
  });

  const [selectedPrerequisites, setSelectedPrerequisites] = useState<string[]>([]);

  const togglePrerequisite = (subjectId: string, checked: boolean) => {
    setSelectedPrerequisites((current) =>
      checked ? [...current, subjectId] : current.filter((id) => id !== subjectId)
    );
  };

  const handleSubmit = () => {
    setError('');
    setSuccess('');

    startTransition(() => {
      createCurriculumSubject({
        curriculumId,
        code: values.code,
        description: values.description,
        units: Number(values.units),
        yearLevel: Number(values.yearLevel),
        semester: values.semester,
        displayOrder: Number(values.displayOrder),
        prerequisiteIds: selectedPrerequisites,
      }).then((result) => {
        if (result?.error) {
          setError(result.error);
          return;
        }

        setSuccess(result?.success || 'Subject created and assigned');
        router.refresh();
      });
    });
  };

  return (
    <div className="space-y-6">
      <FormError message={error} />
      <FormSuccess message={success} />

      <section className="rounded-lg border p-5 space-y-4">
        <h3 className="text-lg font-semibold">Create Subject</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Code</FieldLabel>
            <Input
              value={values.code}
              onChange={(e) => setValues((prev) => ({ ...prev, code: e.target.value }))}
              disabled={isPending}
              placeholder="CS101"
            />
          </Field>
          <Field>
            <FieldLabel>Description</FieldLabel>
            <Input
              value={values.description}
              onChange={(e) => setValues((prev) => ({ ...prev, description: e.target.value }))}
              disabled={isPending}
              placeholder="Introduction to Computing"
            />
          </Field>
          <Field>
            <FieldLabel>Units</FieldLabel>
            <Input
              type="number"
              value={values.units}
              onChange={(e) => setValues((prev) => ({ ...prev, units: e.target.value }))}
              disabled={isPending}
            />
          </Field>
          <Field>
            <FieldLabel>Year Level</FieldLabel>
            <Input
              type="number"
              value={values.yearLevel}
              onChange={(e) => setValues((prev) => ({ ...prev, yearLevel: e.target.value }))}
              disabled={isPending}
            />
          </Field>
          <Field>
            <FieldLabel>Semester</FieldLabel>
            <Select
              value={values.semester}
              onValueChange={(value: SemesterTermValue) =>
                setValues((prev) => ({ ...prev, semester: value }))
              }
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                {SEMESTER_TERMS.map((term) => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Display Order</FieldLabel>
            <Input
              type="number"
              value={values.displayOrder}
              onChange={(e) => setValues((prev) => ({ ...prev, displayOrder: e.target.value }))}
              disabled={isPending}
            />
          </Field>
        </div>

        <section className="space-y-3 rounded-md border bg-muted/20 p-4">
          <div>
            <h4 className="font-medium">Prerequisites</h4>
            <p className="text-sm text-muted-foreground">
              Optionally select existing subjects in this curriculum that should be required before this subject.
            </p>
          </div>

          {prerequisiteOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add at least one subject to the curriculum before setting prerequisites.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {prerequisiteOptions.map((subject) => (
                <label
                  key={subject.id}
                  className="flex items-start gap-3 rounded-md border bg-background p-3"
                >
                  <Checkbox
                    checked={selectedPrerequisites.includes(subject.id)}
                    onCheckedChange={(checked) =>
                      togglePrerequisite(subject.id, checked === true)
                    }
                    disabled={isPending}
                  />
                  <span className="text-sm leading-none">
                    <span className="font-medium">{subject.code}</span>
                    <span className="mt-1 block text-muted-foreground">
                      {subject.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        <Button disabled={isPending} onClick={handleSubmit}>
          {isPending ? 'Saving...' : 'Create Subject'}
        </Button>
      </section>
    </div>
  );
};

export default CreateCurriculumSubjectForm;
