'use client';

import { useRouter } from 'next/navigation';
import {
  Plus,
  X,
} from 'lucide-react';
import {
  useCallback,
  useState,
  useTransition,
} from 'react';

import {
  PageHeader,
  SurfaceTabs,
} from '@/app/_components/shared';
import { Button } from '@/app/_components/ui/button';
import { createBill } from '@/lib/actions/bills/create-bill';
import { deleteBill } from '@/lib/actions/bills/delete-bill';
import { updateBill } from '@/lib/actions/bills/update-bill';
import { billTabs } from '@/lib/navigation';
import type {
  BillFormOptions,
  CreateBillInput,
  DraftBillListItem,
} from '@/types';

import { BillsFilteredView } from './bills-filtered-view';
import { BillsStatusOverview } from './bills-status-overview';
import { DraftBillForm } from './draft-bill-form';
import { DraftBillsView } from './draft-bills-view';

interface BillsWorkspaceProps {
  activeTab: string;
  bills: DraftBillListItem[];
  loadError: string | null;
  options: BillFormOptions;
}

export function BillsWorkspace({
  activeTab,
  bills,
  loadError,
  options,
}: BillsWorkspaceProps) {
  const router = useRouter();
  const [editingBill, setEditingBill] = useState<DraftBillListItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const closeForm = useCallback(() => {
    setEditingBill(null);
    setIsFormOpen(false);
  }, []);

  const openCreateForm = useCallback(() => {
    setEditingBill(null);
    setFormError(null);
    setIsFormOpen(true);
  }, []);

  const selectBillForEdit = useCallback((bill: DraftBillListItem) => {
    setEditingBill(bill);
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

      closeForm();
      router.refresh();
    });
  }, [closeForm, editingBill, router, startTransition]);

  const onDelete = useCallback((id: string) => {
    startTransition(async () => {
      const result = await deleteBill(id);
      if (!result.ok) {
        setFormError(result.error.message);
        return;
      }

      if (editingBill?.id === id) {
        closeForm();
      }

      setDeleteCandidateId(null);
      router.refresh();
    });
  }, [closeForm, editingBill?.id, router, startTransition]);

  return (
    <main className="grid gap-6">
      <PageHeader
        actions={(
          <Button onClick={openCreateForm} type="button" variant="accent">
            <Plus aria-hidden className="size-4" />
            New bill
          </Button>
        )}
        eyebrow="Bill Pay"
        title="Bills"
      />
      <SurfaceTabs activeValue={activeTab} tabs={billTabs} />

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
                onClick={closeForm}
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
                onCancelEdit={closeForm}
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

      {activeTab === 'overview' ? (
        <BillsStatusOverview draftBills={bills} />
      ) : null}
      {activeTab === 'drafts' ? (
        <DraftBillsView
          bills={bills}
          deleteCandidateId={deleteCandidateId}
          isLoading={isPending}
          onCancelDelete={cancelDelete}
          onDelete={onDelete}
          onEdit={selectBillForEdit}
          onRequestDelete={requestDelete}
        />
      ) : null}
      {activeTab === 'approvals' ? (
        <BillsFilteredView
          description="Bills awaiting an approval decision."
          title="For approval"
        />
      ) : null}
      {activeTab === 'payment' ? (
        <BillsFilteredView
          description="Approved bills ready to schedule or release for payment."
          title="For payment"
        />
      ) : null}
    </main>
  );
}
