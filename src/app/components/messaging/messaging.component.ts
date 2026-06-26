import { Component, inject, OnInit, OnDestroy, signal, computed, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagingService, ConversationStaff, Message, ConversationDetail, UserForConversation } from '../../services/messaging/messaging.service';
import { StaffMessagingService } from '../../services/staff-messaging/staff-messaging.service';

@Component({
  selector: 'app-messaging-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messaging.component.html',
  styleUrl: './messaging.component.scss',  
})
export class MessagingComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  private messagingService = inject(MessagingService);
  
  // ✅ AJOUTER : Injection du service StaffMessagingService
  private staffMessagingService = inject(StaffMessagingService);

  // State
  conversations = signal<ConversationStaff[]>([]);
  selectedConversation = signal<ConversationDetail | null>(null);
  messages = signal<Message[]>([]);
  messageText = signal<string>('');
  searchQuery = signal<string>('');

  loadingConversations = signal(false);
  loadingMessages = signal(false);
  sending = signal(false);

  // Modal "Nouvelle conversation"
  showNewConvModal = signal(false);
  usersList = signal<UserForConversation[]>([]);
  selectedUser = signal<UserForConversation | null>(null);
  newConvSubject = signal('');
  newConvMessage = signal('');
  loadingUsers = signal(false);
  startingConv = signal(false);

  private shouldScroll = false;

  // Computed
  filteredConversations = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.conversations();
    return this.conversations().filter(c =>
      c.other_user_name.toLowerCase().includes(q) ||
      c.other_user_email.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.last_message.toLowerCase().includes(q)
    );
  });

  totalUnread = computed(() => this.conversations().reduce((sum, c) => sum + c.unread_count, 0));

  ngOnInit(): void {
    this.loadConversations();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  loadConversations(): void {
    this.loadingConversations.set(true);
    this.messagingService.getConversations().subscribe({
      next: (res) => {
        this.conversations.set(res.results || []);
        this.loadingConversations.set(false);
        
        // ✅ AJOUTER : Rafraîchir le compteur après chargement
        this.staffMessagingService.refresh();
      },
      error: () => this.loadingConversations.set(false),
    });
  }

  selectConversation(conv: ConversationStaff): void {
    this.loadingMessages.set(true);
    this.messages.set([]);
    this.messagingService.getConversationDetail(conv.id).subscribe({
      next: (res) => {
        this.selectedConversation.set(res.conversation);
        this.messages.set(res.conversation.messages || []);
        this.loadingMessages.set(false);
        this.shouldScroll = true;

        // Mettre à jour unread_count dans la liste
        this.conversations.update(list =>
          list.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c)
        );

        // ✅ AJOUTER : Rafraîchir le compteur après sélection (messages marqués comme lus)
        this.staffMessagingService.refresh();

        setTimeout(() => this.messageInput?.nativeElement?.focus(), 100);
      },
      error: () => this.loadingMessages.set(false),
    });
  }

  sendMessage(): void {
    const text = this.messageText().trim();
    const conv = this.selectedConversation();
    if (!text || !conv || this.sending()) return;

    this.sending.set(true);
    this.messagingService.sendMessage(conv.id, text).subscribe({
      next: (res) => {
        this.messages.update(list => [...list, res.message]);
        this.messageText.set('');
        this.sending.set(false);
        this.shouldScroll = true;

        // Mettre à jour last_message dans la liste
        this.conversations.update(list =>
          list.map(c => c.id === conv.id ? {
            ...c,
            last_message: text.substring(0, 100),
            last_message_time: new Date().toISOString(),
          } : c)
        );
        
        // ✅ AJOUTER : Rafraîchir le compteur après envoi
        this.staffMessagingService.refresh();
      },
      error: () => this.sending.set(false),
    });
  }

  onKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  // ── Nouvelle conversation ──────────────────────────────────────
  openNewConvModal(): void {
    this.showNewConvModal.set(true);
    this.selectedUser.set(null);
    this.newConvSubject.set('');
    this.newConvMessage.set('');
    this.loadUsers();
  }

  closeNewConvModal(): void {
    this.showNewConvModal.set(false);
  }

  loadUsers(search?: string): void {
    this.loadingUsers.set(true);
    this.messagingService.getUsersForConversation(search).subscribe({
      next: (res) => {
        this.usersList.set(res.results || []);
        this.loadingUsers.set(false);
      },
      error: () => this.loadingUsers.set(false),
    });
  }

  onUserSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.loadUsers(value);
  }

  selectUser(user: UserForConversation): void {
    this.selectedUser.set(user);
  }

  startConversation(): void {
    const user = this.selectedUser();
    if (!user || this.startingConv()) return;

    this.startingConv.set(true);
    this.messagingService.startConversation(
      user.id,
      this.newConvSubject(),
      this.newConvMessage()
    ).subscribe({
      next: (res) => {
        this.startingConv.set(false);
        this.showNewConvModal.set(false);
        this.loadConversations(); // ← Cela appellera aussi refresh()
        
        // Sélectionner la nouvelle conversation
        setTimeout(() => {
          this.messagingService.getConversationDetail(res.conversation.id).subscribe({
            next: (detail) => {
              this.selectedConversation.set(detail.conversation);
              this.messages.set(detail.conversation.messages || []);
              this.shouldScroll = true;
            }
          });
        }, 300);
      },
      error: () => this.startingConv.set(false),
    });
  }

  archiveConversation(): void {
    const conv = this.selectedConversation();
    if (!conv) return;

    const newArchived = !conv.is_archived;
    this.messagingService.archiveConversation(conv.id, newArchived).subscribe({
      next: () => {
        this.selectedConversation.update(c => c ? { ...c, is_archived: newArchived } : null);
        this.loadConversations(); // ← Cela appellera aussi refresh()
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────
  getInitial(name: string): string {
    return name?.charAt(0)?.toUpperCase() ?? '?';
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    }
  }

  formatMessageTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  isOwnMessage(msg: Message): boolean {
    return msg.sender_role === 'staff';
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch { }
  }
}