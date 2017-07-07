# frozen_string_literal: true

class REST::NotificationSerializer < ActiveModel::Serializer
  attributes :id, :type, :created_at

  belongs_to :from_account, key: :account, serializer: REST::AccountSerializer
  belongs_to :status, if: :status_type?,   serializer: REST::StatusSerializer

  def status_type?
    [:favourite, :reblog, :mention].include?(object.type)
  end
end
