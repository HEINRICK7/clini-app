"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useCliniServices } from "@/app/service-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isUnauthorized } from "@/lib/error-policy";
import type { Notification } from "@/app/services";

export function NotificationWorkspace() {
  const { notifications: notificationService } = useCliniServices();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const notificationsQuery = useQuery({ queryKey: ["notifications", page], queryFn: () => notificationService.listNotifications({ page }), retry: false });
  const readMutation = useMutation({
    mutationFn: notificationService.markNotificationRead,
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["notifications"] }); },
  });

  if (notificationsQuery.isError && isUnauthorized(notificationsQuery.error)) {
    return <Card className="p-5"><h2 className="text-lg font-bold">Notificações</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Entre como dentista proprietário para acessar as notificações.</p></Card>;
  }
  if (notificationsQuery.isError) return <Card className="p-5"><p className="text-sm text-danger">Não foi possível carregar as notificações.</p></Card>;

  const notifications = notificationsQuery.data?.items ?? [];
  const totalPages = notificationsQuery.data?.totalPages ?? 0;
  return <Card className="p-5 sm:p-6">
    <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Pendências e eventos</p><h2 className="mt-1 text-xl font-bold tracking-tight">Notificações internas</h2></div><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{notificationsQuery.data?.totalItems ?? 0}</span></div>
    <div className="mt-4 grid gap-3">
      {notificationsQuery.isPending ? <p className="text-sm text-muted-foreground">Carregando notificações…</p> : null}
      {!notificationsQuery.isPending && !notifications.length ? <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Nenhuma notificação registrada.</p> : null}
      {notifications.map((notification) => <NotificationCard key={notification.id} notification={notification} busy={readMutation.isPending} onRead={() => readMutation.mutate(notification.id)} />)}
      {totalPages > 1 ? <nav aria-label="Paginação de notificações" className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">Página {page + 1} de {totalPages}</p><div className="flex gap-2"><Button disabled={page === 0 || notificationsQuery.isFetching} onClick={() => setPage((current) => current - 1)} size="sm" variant="outline">Anterior</Button><Button disabled={page + 1 >= totalPages || notificationsQuery.isFetching} onClick={() => setPage((current) => current + 1)} size="sm" variant="outline">Próxima</Button></div></nav> : null}
    </div>
  </Card>;
}

function NotificationCard({ notification, busy, onRead }: { notification: Notification; busy: boolean; onRead: () => void }) {
  return <article className={`rounded-2xl border p-4 ${notification.unread ? "border-primary bg-cyan-50/30" : "border-border"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">{notification.type.replaceAll("_", " ")}</p><h3 className="mt-1 font-bold">{notification.title}</h3></div><span className="text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleString("pt-BR")}</span></div><p className="mt-2 text-sm leading-5 text-muted-foreground">{notification.message}</p>{notification.unread ? <Button className="mt-3" disabled={busy} onClick={onRead} size="sm" variant="outline">Marcar como lida</Button> : <p className="mt-3 text-xs font-semibold text-success">Lida</p>}</article>;
}
