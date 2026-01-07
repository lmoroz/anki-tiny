import { createVNode, render } from 'vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'

/**
 * Composable для программного вызова диалога подтверждения.
 *
 * @returns {object} - Объект с методом confirm
 */
export function useConfirm() {
  /**
   * Показывает диалог подтверждения и возвращает промис.
   *
   * @param {string | ConfirmOptions} options - Опции диалога или строка сообщения
   * @returns {Promise<boolean>} - Promise, который разрешается в true (подтверждение) или false (отмена)
   */
  const confirm = (options) => {
    return new Promise((resolve) => {
      const props = typeof options === 'string'
        ? { message: options, title: 'Подтверждение' }
        : { title: 'Подтверждение', ...options }

      const container = document.createElement('div')
      document.body.appendChild(container)

      const close = () => {
        render(null, container)
        document.body.removeChild(container)
      }

      const vnode = createVNode(ConfirmDialog, {
        ...props,
        resolve,
        close,
      })

      render(vnode, container)
    })
  }

  return { confirm }
}
