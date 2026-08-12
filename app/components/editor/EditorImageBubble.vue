<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import { NodeSelection } from '@tiptap/pm/state'

const props = defineProps<{
  editor: Editor
}>()

const open = ref(false)
const alt = ref('')
const title = ref('')
const panelStyle = ref<Record<string, string>>({})
const panelRef = ref<HTMLElement | null>(null)

function loadDrafts() {
  const attrs = props.editor.getAttributes('image')
  alt.value = attrs.alt || ''
  title.value = attrs.title || ''
}

function getSelectedImageEl(): HTMLElement | null {
  const { selection } = props.editor.state
  if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'image') {
    return null
  }
  const nodeDom = props.editor.view.nodeDOM(selection.from)
  if (!(nodeDom instanceof HTMLElement)) return null
  return nodeDom.tagName === 'IMG' ? nodeDom : nodeDom.querySelector('img')
}

function positionPanel() {
  const img = getSelectedImageEl()
  if (!img) return

  const rect = img.getBoundingClientRect()
  const panelWidth = 320
  const gap = 12
  const padding = 12
  const panelHeight = panelRef.value?.offsetHeight || 220

  const left = Math.min(
    Math.max(padding, rect.left + rect.width / 2 - panelWidth / 2),
    window.innerWidth - panelWidth - padding
  )

  const spaceAbove = rect.top - padding
  const spaceBelow = window.innerHeight - rect.bottom - padding
  const placeAbove = spaceAbove >= panelHeight + gap && spaceAbove >= spaceBelow

  let top = placeAbove
    ? rect.top - gap - panelHeight
    : rect.bottom + gap

  // Keep the full panel (including Alt text) inside the viewport
  top = Math.min(top, window.innerHeight - panelHeight - padding)
  top = Math.max(padding, top)

  panelStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    width: `${panelWidth}px`,
    zIndex: '200'
  }
}

function openPanel() {
  loadDrafts()
  open.value = true
  nextTick(() => {
    positionPanel()
    // Re-measure after form fields paint so Alt text isn't clipped
    requestAnimationFrame(() => positionPanel())
  })
}

function close() {
  open.value = false
}

function onEditorClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  if (target.closest('[data-image-meta-panel]')) return

  if (target.tagName === 'IMG' && props.editor.isActive('image')) {
    openPanel()
    return
  }

  close()
}

function onSelectionUpdate() {
  if (!props.editor.isActive('image')) {
    close()
    return
  }
  if (open.value) {
    positionPanel()
  }
}

function onScrollOrResize() {
  if (open.value) positionPanel()
}

function save() {
  if (!props.editor.isActive('image')) {
    close()
    return
  }

  props.editor.chain().updateAttributes('image', {
    alt: alt.value.trim(),
    title: title.value.trim()
  }).run()
  close()
}

onMounted(() => {
  props.editor.view.dom.addEventListener('click', onEditorClick)
  props.editor.on('selectionUpdate', onSelectionUpdate)
  window.addEventListener('scroll', onScrollOrResize, true)
  window.addEventListener('resize', onScrollOrResize)
})

onBeforeUnmount(() => {
  props.editor.view.dom.removeEventListener('click', onEditorClick)
  props.editor.off('selectionUpdate', onSelectionUpdate)
  window.removeEventListener('scroll', onScrollOrResize, true)
  window.removeEventListener('resize', onScrollOrResize)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      ref="panelRef"
      data-image-meta-panel
      class="flex flex-col gap-3 p-3 rounded-lg border-2 border-primary bg-elevated shadow-xl ring-1 ring-primary/20"
      :style="panelStyle"
      @mousedown.stop
      @click.stop
    >
      <div class="space-y-1">
        <label class="block text-sm font-medium text-default">Alt text</label>
        <UInput
          v-model="alt"
          size="sm"
          placeholder="Describe the image"
          aria-label="Image alt text"
          class="w-full"
        />
      </div>
      <div class="space-y-1">
        <label class="block text-sm font-medium text-default">Title</label>
        <UInput
          v-model="title"
          size="sm"
          placeholder="Tooltip text"
          aria-label="Image title"
          class="w-full"
        />
      </div>
      <div class="flex gap-2 justify-end">
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          label="Cancel"
          @click.stop="close"
        />
        <UButton
          size="xs"
          color="primary"
          label="Save"
          @click.stop="save"
        />
      </div>
    </div>
  </Teleport>
</template>
