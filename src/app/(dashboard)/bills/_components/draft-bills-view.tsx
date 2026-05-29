'use client';

import { useRouter } from 'next/navigation';
import {
  X,
} from 'lucide-react';
import {
  useCallback,
  useState,
  useTransition,
} from 'react';

import { Button } from '@/app/_components/ui/button';
import { createBill } from '@/lib/actions/bills/create-bill';
import { deleteBill } from '@/lib/actions/bills/delete-bill';
import { updateBill } from '@/lib/actions/bills/update-bill';
import type {
  BillFormOptions,
  CreateBillInput,
  DraftBillListItem,
} from '@/types';

import { DraftBillForm } from './draft-bill-form';
import { DraftBillsTable } from './draft-bills-table';

interface DraftBillsViewProps {
  bills: DraftBillListItem[];
  loadError: string | null;
  options: BillFormOptions;
}

export function DraftBillsView({ bills, loadError, options }: DraftBillsViewProps) {
  const router = useRouter();
  const [editingBill, setEditingBill] = useState<DraftBillListItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectBillForEdit = useCallback((bill: DraftBillListItem | null) => {
    setEditingBill(bill);
    setFormError(null);
    setIsFormOpen(Boolean(bill));
  }, []);

  const cancelEdit = useCallback(() => {
    selectBillForEdit(null);
  }, [selectBillForEdit]);

  const openCreateForm = useCallback(() => {
    setEditingBill(null);
    setFormError(null);
    setIsFormOpen(true);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteCandidateId(null);
  }, []);

  const requestDelete = useCallback((id: string) => {
    setDeleteCandidateId(id);
  }, []);

  const onSubmit = useCallback((input: CreateBillInput) => {
    setFormError(null);

    startTransition(async () => {
      const result = editingBill
        ? await updateBill({
          ...input,
          id: editingBill.id,
          expectedUpdatedAt: editingBill.updatedAt.toISOString(),
        })
        : await createBill(input);

      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }

      selectBillForEdit(null);
      router.refresh();
    });
  }, [editingBill, router, selectBillForEdit, startTransition]);

  const onDelete = useCallback((id: string) => {
    startTransition(async () => {
      const result = await deleteBill(id);
      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }

      if (editingBill?.id === id) {
        selectBillForEdit(null);
      }

      setDeleteCandidateId(null);
      router.refresh();
    });
  }, [editingBill?.id, router, selectBillForEdit, startTransition]);

  return (
    <div className="grid gap-5">
      {isFormOpen ? (
        <div
          className={[
            'fixed inset-0 z-50 grid place-items-center bg-slate-950/50',
            'p-3 sm:p-6',
          ].join(' ')}
          role="dialog"
          aria-modal
          aria-label={editingBill ? 'Edit bill' : 'New bill'}
        >
          <div className="w-full max-w-5xl rounded-md border border-slate-200 bg-white shadow-2xl">
            <div className="flex justify-end px-4 pt-4">
              <Button
                aria-label="Close bill form"
                onClick={cancelEdit}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden className="size-4" />
              </Button>
            </div>
            <div className="max-h-[85dvh] overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
              <DraftBillForm
                editingBill={editingBill}
                formError={formError}
                isPending={isPending}
                loadError={loadError}
                onCancelEdit={cancelEdit}
                onSubmit={onSubmit}
                options={options}
              />
            </div>
          </div>
        </div>
      ) : null}
      {!isFormOpen && formError ? (
        <div
          className={[
            'rounded-md border border-rose-200 bg-rose-50 p-4',
            'text-sm text-rose-950',
          ].join(' ')}
        >
          {formError}
        </div>
      ) : null}
      <DraftBillsTable
        bills={bills}
        deleteCandidateId={deleteCandidateId}
        onCancelDelete={cancelDelete}
        onCreate={openCreateForm}
        onDelete={onDelete}
        onEdit={selectBillForEdit}
        onRequestDelete={requestDelete}
      />
    </div>
  );
}
